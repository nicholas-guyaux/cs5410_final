(function (exports) {
  function pointInPolygon () {

  }

  function Point (x, y) {
    var point = {
      x: x,
      y: y,
    };
    return point;
  }

  function lineSegmentLineIntersection (seg, line) {
    var inter = Line(seg.a, seg.b).lineIntersection(line);
    var minX = Math.min(seg.a.x, seg.b.x);
    var maxX = Math.max(seg.a.x, seg.b.x);
    var minY = Math.min(seg.a.y, seg.b.y);
    var maxY = Math.max(seg.a.y, seg.b.y);
    if(inter && inter.x >= minX && inter.x <= maxX
      && inter.y >= minY && inter.y <= maxY) {
      return inter;
    }
    return false;
  }

  function LineSegment (point_a, point_b) {
    const lineSeg = {
      // first endpoint a
      a: point_a,
      // second endpoint b
      b: point_b,
      lineIntersection (line) {
        return lineSegmentLineIntersection(lineSeg, line);
      },
      /**
       * gets the angle in radians
       */
      get angle () {
        var deltaY = lineSeg.b.y - lineSeg.a.y;
        var deltaX = lineSeg.b.x - lineSeg.a.x;
        return Math.atan2(deltaY, deltaX);
      },
      get distance () {
        return Math.sqrt(Math.pow(lineSeg.a.x-lineSeg.b.x, 2) + Math.pow(lineSeg.a.y-lineSeg.b.y, 2));
      },
      // https://stackoverflow.com/a/1968345/2066736
      lineSegmentIntersection (lineSeg2) {
        const [p0_x, p0_y] = [lineSeg.a.x, lineSeg.a.y];
        const [p1_x, p1_y] = [lineSeg.b.x, lineSeg.b.y];
        const [p2_x, p2_y] = [lineSeg2.a.x, lineSeg2.a.y];
        const [p3_x, p3_y] = [lineSeg2.b.x, lineSeg2.b.y];
        let s1_x, s1_y, s2_x, s2_y;
        s1_x = p1_x - p0_x;     s1_y = p1_y - p0_y;
        s2_x = p3_x - p2_x;     s2_y = p3_y - p2_y;
      
        let s, t;
        s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
        t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);
      
        if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
        {
          const i_x = p0_x + (t * s1_x);
          const i_y = p0_y + (t * s1_y);
          return Point({
            x: i_x,
            y: i_y,
          })
        }
      
        // No collision
        return false; 
      },
    };

    return lineSeg;
  }

  /**
   * 
   * @param {Point} a 
   * @param {Point} b 
   */
  function Vector (a, b) {
    var memo = [x,y,result];
    const vec = {
      point: Point(b.x - a.x, b.y - a.y),
      get x () {
        return this.point.x;
      },
      get y () {
        return this.point.y;
      },
      get magnitude () {
        if(this.x === memo[0] && this.y === memo[1]) {
          // value has been computed
          return memo[2];
        } else {
          // recompute value
          memo = [this.x, this.y, Math.sqrt(this.x ** 2 + this.y ** 2)];
          return memo[2]
        }
      },
      dotProduct (vector) {
        return Vector(Point(0, 0), Point(this.point.x * vector.point.x, this.point.y * vector.point.y));
      },
      scalarAdd (addition) {
        return Vector(this.x+addition, this.y+addition);
      },
      scalarMultiply (multiplier) {
        return Vector(this.x*multiplier, this.y*multiplier);
      },
      get unitVector () {
        return  Vector(Point(0, 0), Point(this.x/this.magnitude, this.magnitude))
      },

    };
    return vec;
  }

  function shuffle(array) {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
      // Pick a random index
      let index = Math.floor(Math.random() * counter);

      // Decrease counter by 1
      counter--;

      // And swap the last element with it
      let temp = array[counter];
      array[counter] = array[index];
      array[index] = temp;
    }

    return array;
  }

  /**
   * 
   * @param {Point} point_a 
   * point on line
   * @param {Point} point_b 
   * another point on line
   */
  function Line (point_a, point_b) {

    const that = {
      a: point_a,
      b: point_b,
      get A () {
        return that.b.y - that.a.y;
      },
      get B () {
        return that.a.x - that.b.x;
      },
      get C () {
        return that.A * that.a.x + that.B * that.a.y
      },
      /**
       * https://www.topcoder.com/community/data-science/data-science-tutorials/geometry-concepts-line-intersection-and-its-applications/
       * @param {Line} line 
       * @returns {Point | null} 
       */
      lineIntersection (line) {
        const [A1, B1, C1] = [that.A, that.B, that.C]
        const [A2, B2, C2] = [line.A, line.B, line.C];
        const det = A1*B2 - A2*B1;
        if(det == 0){
            //Lines are parallel
            return null;
        }else{
            return Point((B2*C1 - B1*C2)/det, 
              (A1*C2 - A2*C1)/det)
        }
      },
      lineSegmentIntersection (lineSeg) {
        return lineSegmentLineIntersection(lineSeg, that);
      },
      lineWithinRect (rect) {
        var p1 = null;
        var p2 = null;
        var segments = shuffle([rect.boundingLeft, rect.boundingRight, rect.boundingBottom, rect.boundingTop]);
        for(var seg of segments) {
          let intersection = that.lineSegmentIntersection(seg);
          if(intersection) {
            if(p1 && !p2) {
              p2 = intersection;
              break;
            }
            if(!p1) {
              p1 = intersection;
            }
          }
        }
        if(p1 && p2) {
          return LineSegment(p1, p2);
        }

        return null;
      }
    };
    return that;
  }

  function Ray (point, vector) {
    return {
      point: point,
      vector: vector,
    }
  }

  function Circle (spec) {
    let that = {
      radius: spec.radius,
      x: spec.x,
      y: spec.y,
      get boundingRect () {
        return Rectangle({
          width: that.radius * 2,
          height: that.radius * 2,
          x: that.x - that.radius,
          y: that.y - that.radius,
        });
      },
      point: {
        get x () { 
          return that.x;
        },
        get y () {
          return that.y;
        }
      },
      containsPoint (point) {
        return LineSegment(that.point, point).distance <= that.radius;
      }
    }

    return that;
  }

  function Rectangle (spec) {
    // x and y is from top left corner
    var center = {
      get x () {
        return that.x + that.width / 2
      },
      get y () {
        return that.y + that.height / 2;
      },
    };
    var that = {
      height: spec.height,
      width: spec.width, 
      x: spec.x,
      y: spec.y,
      get top () {
        return that.y;
      },
      get left () {
        return that.x;
      },
      get right () {
        return that.x + that.width;
      },
      get bottom () {
        return that.y + that.height;
      },
      get center () {
        return center
      },
      /**
       * bounding left line segment
       */
      get boundingLeft () {
        var tl = Point(that.left, that.top);
        var bl = Point(that.left, that.bottom);
        return LineSegment(tl, bl);
      },
      get boundingRight () {
        var tr = Point(that.right, that.top);
        var br = Point(that.right, that.bottom);
        return LineSegment(tr, br);
      },
      get boundingBottom () {
        var bl = Point(that.left, that.bottom);
        var br = Point(that.right, that.bottom);
        return LineSegment(bl, br);
      },
      get boundingTop () {
        var tl = Point(that.left, that.top);
        var tr = Point(that.right, that.top);
        return LineSegment(tl, tr);
      },
      containsPoint (point) {
        if(that.left <= point.x && that.right >= point.x && that.top <= point.y && that.bottom >= point.y) {
          return true;
        }
        return false;
      },
      intersectsRect (B) {
        // https://gamedev.stackexchange.com/a/29796
        const A = that;
        const w = 0.5 * (A.width + B.width);
        const h = 0.5 * (A.height + B.height);
        const dx = A.center.x - B.center.x;
        const dy = A.center.y - B.center.y;

        if (Math.abs(dx) <= w && Math.abs(dy) <= h)
        {
          /* collision! */
          const wy = w * dy;
          const hx = h * dx;

          if (wy > hx) {
            if (wy > -hx) {
              /* at the bottom */
              return Rectangle.intersectDir.bottom;
            } else {
                /* on the left */
                return Rectangle.intersectDir.left;
            }
          }else {
            if (wy > -hx) {
              /* on the right */
              return Rectangle.intersectDir.right;
            } else {
              /* collision at the top */
              return Rectangle.intersectDir.top;
            }
          }
        } else {
          return false;
        }
      },
      // get edges () {
      //   return [that]
      // },
    };
    
    return that;
  }
  Rectangle.intersectDir = {
    left: 'left',
    right: 'right',
    bottom: 'bottom',
    top: 'top'
  }

  Object.assign(exports,{
    Rectangle,
    Circle,
    LineSegment,
    Point,
    Line,
  });
})(typeof exports === 'undefined' ? this['Geometry'] = {} : exports);
